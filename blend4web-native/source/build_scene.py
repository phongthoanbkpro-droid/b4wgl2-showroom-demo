import bpy, sys, os, math
from mathutils import Vector
sdk=os.environ.get('B4W_SDK_ROOT')
if not sdk: raise RuntimeError('Set B4W_SDK_ROOT to a Blend4Web CE 18.05 SDK root')
sys.path.insert(0,os.path.join(sdk,'addons'))
bpy.ops.wm.addon_enable(module='blend4web')
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='BLEND4WEB'
scene.world.horizon_color=(0.12,0.12,0.12)
scene.world.light_settings.use_environment_light=True
scene.world.light_settings.environment_energy=0.7

def material(name,color,metal=False):
 m=bpy.data.materials.new(name); m.diffuse_color=color; m.diffuse_intensity=0.8; m.specular_intensity=0.6 if metal else 0.25; m.specular_hardness=80 if metal else 35; return m
def cube(name,loc,scale,mat):
 bpy.ops.mesh.primitive_cube_add(location=loc);o=bpy.context.object;o.name=name;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat); bevel=o.modifiers.new('Soft edges','BEVEL');bevel.width=.08;bevel.segments=3; bpy.ops.object.modifier_apply(modifier=bevel.name);return o
def cyl(name,loc,radius,depth,mat):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(mat);return o
shell=material('Enamel',(.08,.36,.32)); dark=material('Graphite',(.08,.11,.13)); pale=material('Porcelain',(.75,.78,.72)); brass=material('Brass',(.7,.48,.18),True)
cyl('Display plinth',(0,0,-.14),2.25,.22,pale)
cube('Main housing',(0,0,1.05),(.83,.52,.95),shell)
cube('Front panel',(0,-.56,1.18),(.58,.06,.48),dark)
cube('Control display',(0,-.64,1.29),(.35,.025,.17),pale)
cyl('Top vessel',(0,0,2.15),.46,.35,brass)
cyl('Top cap',(0,0,2.36),.50,.09,dark)
for x in [-.45,.45]:
 cyl('Foot',(x,0,.04),.13,.22,dark)
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,size=.09,location=(x,-.65,.86)); bpy.context.object.data.materials.append(brass)
bpy.ops.object.camera_add(location=(4.8,-7.3,4.1));camera=bpy.context.object;camera.name='Camera';target=Vector((0,0,1.0));camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.b4w_move_style='TARGET';camera.data.b4w_target=target;camera.data.lens=35;scene.camera=camera
bpy.ops.object.lamp_add(type='SUN',location=(4,-6,8));sun=bpy.context.object;sun.rotation_euler=(.45,-.4,-.5);sun.data.energy=1.1
bpy.ops.object.lamp_add(type='HEMI',location=(-4,-3,5));bpy.context.object.data.energy=.45
base=os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(base,'source','atelier.blend'))
result=bpy.ops.export_scene.b4w_json('EXEC_DEFAULT',filepath=os.path.join(base,'assets','atelier.json'),do_autosave=False,save_export_path=False)
print('EXPORT RESULT',result)
if 'FINISHED' not in result: raise RuntimeError('Export failed')

